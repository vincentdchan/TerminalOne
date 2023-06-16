import { useEffect, useState } from "react";
import * as fs from "@pkg/utils/fs";
import { CommandItem } from "./command_item";
import type { IntelligenceKind } from "./intelligence_kind";
import PnpmImage from "./images/pnpm-no-name-with-frame.svg";
import YarnImage from "./images/yarn.png";
import classes from "./node_itlg.module.css";

const subTypeToImage: Record<string, string> = {
  npm: PnpmImage,
  pnpm: PnpmImage,
  yarn: YarnImage,
};

export interface NodeItlgProps {
  currentDir: string;
  kind: IntelligenceKind;
}

export interface ProjectInfo {
  name?: string;
  version?: string;
  description?: string;
}

export function NodeItlg(props: NodeItlgProps) {
  const { currentDir, kind } = props;

  const [prjInfo, setPrjInfo] = useState<ProjectInfo>({});
  const [scripts, setScripts] = useState<string[]>([]);

  const readFile = async (path: string) => {
    const str = await fs.readAll(path);
    const data = JSON.parse(str);
    setPrjInfo({
      name: data.name,
      version: data.version,
      description: data.description,
    });

    const scripts = Object.keys(data.scripts || {});
    setScripts(scripts);
  };
  useEffect(() => {
    const fileToRead = currentDir + "/package.json";
    readFile(fileToRead);
  }, [currentDir]);

  const imgSrc = subTypeToImage[props.kind.subType || "npm"] as string;

  return (
    <div className={`t1-itlg ${classes.nodeItlg}`}>
      <div className={classes.summary}>
        <img src={imgSrc} alt="" />
        <div className={classes.desp}>
          <div>{prjInfo.name}</div>
          {prjInfo.version && (
            <div className={classes.light}>{prjInfo.version}</div>
          )}
        </div>
      </div>
      {prjInfo.description && (
        <div className={classes.prjDesp}>{prjInfo.description}</div>
      )}
      <div className={classes.commandList}>
        <div className="inner">
          <CommandItem cmd={`${kind.subType ?? "npm"} install\r`}>
            install
          </CommandItem>
          {scripts.map((script) => (
            <CommandItem
              key={script}
              cmd={`${kind.subType ?? "npm"} run ${script}\r`}
            >
              {script}
            </CommandItem>
          ))}
        </div>
      </div>
    </div>
  );
}
