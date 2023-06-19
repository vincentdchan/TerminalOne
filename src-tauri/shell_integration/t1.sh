
# shellcheck disable=SC2166
if [ -z "${BASH_VERSION}" -a -z "${ZSH_NAME}" ] ; then
  # Only for bash or zsh
  return 0
fi

if [[ "$TERM_PROGRAM" != "Terminal_One.app" ]]; then
  return 0
fi

___osc7() {
  printf "\033]7;file://%s%s\033\\" "${HOSTNAME}" "${PWD}"
}

precmd_functions+=(___osc7)
