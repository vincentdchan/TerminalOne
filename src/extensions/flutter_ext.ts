import { Extension } from "@pkg/models/extension";

const flutterExt: Extension = {
  name: "flutter",
  testFile: "pubspec.yaml",
  generateActions: () => {
    return {
      title: "flutter",
      color: "rgb(117, 191, 235)",
      onTrigger: () => {
        return [
          {
            key: "flutter-run",
            command: "flutter run",
          },
          {
            key: "flutter-test",
            command: "flutter test",
          },
          {
            key: "flutter-pub-get",
            command: "flutter pub get",
          },
          {
            key: "flutter-build",
            command: "flutter build",
          },
        ];
      },
    };
  },
};

export default flutterExt;
