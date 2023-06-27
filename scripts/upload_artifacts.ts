import * as path from "path";
import * as fs from "fs";
import * as child_process from "child_process";
import fetch from "node-fetch";
import { ProxyAgent } from "proxy-agent";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const BUNDLE_PATH = "src-tauri/target/universal-apple-darwin/release/bundle/";

const serviceAccount = JSON.parse(
  fs.readFileSync("./scripts/t1-api-firebase-adminsdk.json", "utf-8")
);

initializeApp({
  storageBucket: "t1-api-9b615.appspot.com",
  credential: cert(serviceAccount),
});

function findFilesToUpload(dir: string, suffixes: string[]): string[] {
  const result: string[] = [];

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      continue;
    }
    for (const suffix of suffixes) {
      if (file.endsWith(suffix)) {
        result.push(filePath);
      }
    }
  }

  return result;
}

function readPackageVersion(dir: string): string {
  const tauriConfigPath = path.join(dir, "src-tauri", "tauri.conf.json");
  const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, "utf-8"));
  return tauriConfig.package.version;
}

async function getGitDescribe(): Promise<string> {
  return new Promise((resolve, reject) => {
    child_process.exec("git describe --tags", (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(stdout.trim());
    });
  });
}


const ARCHS = ["x86_64", "aarch64"] as const;

async function createRecordOnAirtable(
  version: string,
  gitVersion: string,
  dmgDest: string,
  dmgSize: number,
  updateDest: string,
  signature: string
) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  if (!AIRTABLE_TOKEN) {
    console.log("no token found, skip creating record on airtable");
    return;
  }
  const now = new Date();

  for (const arch of ARCHS) {
    const resp = await fetch(
      "https://api.airtable.com/v0/app1QVeXlDjJrP9dh/tblzxoRZneJriFgfh",
      {
        method: "post",
        agent: new ProxyAgent(),
        body: JSON.stringify({
          records: [
            {
              fields: {
                Name: version,
                "Release Date": `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
                Platform: "darwin",
                Arch: arch,
                "Git Describe": gitVersion,
                "Installer Path": dmgDest,
                "Installer Size": dmgSize,
                "Updater Path": updateDest,
                "Signature": signature,
                Range: "Testing",
              },
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      }
    );
    const data = await resp.json();
    console.log("data:", data);
  }
}

async function uploadArtifacts() {
  try {
    console.log("Begin uploading artifacts: ", process.cwd());
    const macOSDir = path.join(process.cwd(), BUNDLE_PATH, "macos");
    const dmgDir = path.join(process.cwd(), BUNDLE_PATH, "dmg");

    const macosFiles = findFilesToUpload(macOSDir, [
      ".zip",
      ".tar.gz",
      ".tar.gz.sig",
    ]);
    const dmgFiles = findFilesToUpload(dmgDir, [".dmg"]);
    const files = [...macosFiles, ...dmgFiles];

    const configVersion: string = readPackageVersion(process.cwd());
    const gitDescribe: string = await getGitDescribe();

    console.log("prepare to upload:", files);
    console.log("configVersion:", configVersion);
    console.log("gitDescribe:", gitDescribe);

    const bucket = getStorage().bucket();
    const platform = process.platform;

    let dmgDest: string | undefined;
    let dmgSize: number | undefined;
    let updateDest: string | undefined;
    let signature: string | undefined;

    for (const file of files) {
      const basename = path.basename(file);
      const destination = `releases/${gitDescribe}/${platform}/${basename}`;
      console.log("uploading:", file, "to", destination);
      await bucket.upload(file, {
        destination,
      });
      if (destination.endsWith(".dmg")) {
        dmgDest = destination;

        const fileStat = fs.statSync(file);
        dmgSize = fileStat.size;
      } else if (destination.endsWith(".tar.gz")) {
        updateDest = destination;
      } else if (file.endsWith(".tar.gz.sig")) {
        const fileContent = fs.readFileSync(file, "utf-8");
        signature = fileContent;
      }
    }

    await createRecordOnAirtable(
      configVersion,
      gitDescribe,
      dmgDest!,
      dmgSize!,
      updateDest!,
      signature!
    );
  } catch (err) {
    console.error(err);
    console.error(err?.config?.agent?.proxy);
    process.exit(1);
  }
}

uploadArtifacts();
