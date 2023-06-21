import { ExtensionConfig } from "@pkg/models/extension";
import explorerExt from "./explorer_ext";
import gitExt from "./git_ext";
import npmExt from "./npm_ext";
import cargoExt from "./cargo_ext";
import flutterExt from "./flutter_ext";

const extensions: ExtensionConfig[] = [
  explorerExt,
  gitExt,
  npmExt,
  flutterExt,
  cargoExt,
];

export default extensions;
