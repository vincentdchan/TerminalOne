import { ExtensionConfig } from "@pkg/models/extension";

const flutterExt: ExtensionConfig = {
  name: "flutter",
  setup(context) {
    context.onResolve(
      {
        testFile: "pubspec.yaml",
      },
      () => {
        return {
          title: "flutter",
          color: "rgb(117, 191, 235)",
        };
      }
    );
    context.onActionTrigger(() => {
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
    });
  },
};

export default flutterExt;
