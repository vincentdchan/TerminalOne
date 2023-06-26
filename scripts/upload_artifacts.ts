import * as path from "path";
import * as fs from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { ProxyAgent } from 'proxy-agent';

const BUNDLE_PATH = "src-tauri/target/universal-apple-darwin/release/bundle/";

const serviceAccount = JSON.parse(fs.readFileSync("./scripts/t1-api-firebase-adminsdk.json", "utf-8"));

const agent = new ProxyAgent();

initializeApp({
  storageBucket: "t1-api-9b615.appspot.com",
  httpAgent: agent,
  credential: cert(serviceAccount, agent),
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

async function uploadArtifacts() {
  try {
    console.log("Begin uploading artifacts: ", process.cwd());
    const macOSDir = path.join(process.cwd(), BUNDLE_PATH, "macos");
    const dmgDir = path.join(process.cwd(), BUNDLE_PATH, "dmg");
    
    const macosFiles = findFilesToUpload(macOSDir, [".zip", ".tar.gz", ".tar.gz.sig"]);
    const dmgFiles = findFilesToUpload(dmgDir, [".dmg"]);
    const files = [...macosFiles, ...dmgFiles];

    const version: string = readPackageVersion(process.cwd());

    console.log("prepare to upload:", files);
    console.log("version:", version);

    const bucket = getStorage().bucket();
    const platform = process.platform;

    for (const file of files) {
      const destination = `${version}/${platform}/${path.basename(file)}`;
      console.log("uploading:", file, "to", destination);
      await bucket.upload(file, {
        destination,
      });
    }

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

uploadArtifacts();
