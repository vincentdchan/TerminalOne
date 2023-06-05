import { useContext, useEffect, useState } from "react";
import { useObservable } from "@pkg/hooks/observable";
import * as fs from "@pkg/utils/fs";
import { AppContext } from "@pkg/contexts/app_context";
import { find } from "lodash-es";
import { NodeItlg } from "./node_itlg";
import type { IntelligenceKind } from "./intelligence_kind";
import "./intelligence_tab.scss";


export function IntelligenceTab() {
  const appState = useContext(AppContext)!;
  const currentDir = useObservable(appState.currentDir$, undefined);
  const [intelligenceType, setIntelligenceType] = useState<
    IntelligenceKind | undefined
  >(undefined);

  const fetchDir = async (currentDir: string) => {
    const resp = await fs.ls(currentDir);

    const pkgJson = find(
      resp.content,
      (file) => file.filename === "package.json"
    );
    if (pkgJson) {
      const yarnLock = find(
        resp.content,
        (file) => file.filename === "yarn.lock"
      );
      const pnpmLock = find(
        resp.content,
        (file) => file.filename === "pnpm-lock.yaml"
      );
      if (pnpmLock) {
        setIntelligenceType({
          type: "node",
          subType: "pnpm",
        });
      } else if (yarnLock) {
        setIntelligenceType({
          type: "node",
          subType: "yarn",
        });
      } else {
        setIntelligenceType({
          type: "node",
          subType: "npm",
        });
      }
      return;
    }

    const cargoToml = find(
      resp.content,
      (file) => file.filename === "Cargo.toml"
    );
    if (cargoToml) {
      setIntelligenceType({
        type: "cargo",
      });
      return;
    }

    setIntelligenceType(undefined);
  };

  useEffect(() => {
    if (currentDir) {
      fetchDir(currentDir);
    } else {
      setIntelligenceType(undefined);
    }
  }, [currentDir]);

  return (
    <div className="gpterm-intelligence-tab">
      {currentDir && intelligenceType?.type === "node" ? (
        <NodeItlg kind={intelligenceType} currentDir={currentDir} />
      ) : (
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          No info
        </div>
      )}
    </div>
  );
}
