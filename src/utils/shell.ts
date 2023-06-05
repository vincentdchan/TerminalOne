
export function escapeShellPath(content: string) {
  return content.replaceAll(' ', '\\ ');
}
