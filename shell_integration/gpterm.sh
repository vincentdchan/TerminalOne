
# shellcheck disable=SC2166
if [ -z "${BASH_VERSION}" -a -z "${ZSH_NAME}" ] ; then
  # Only for bash or zsh
  return 0
fi

__gpterm_osc7() {
  printf "\033]7;file://%s%s\033\\" "${HOSTNAME}" "${PWD}"
}

precmd_functions+=(__gpterm_osc7)
