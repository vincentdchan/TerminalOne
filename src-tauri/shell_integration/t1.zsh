
prompt_t1_state_setup() {
  typeset -gA prompt_t1_state
	prompt_t1_state+=(
		prompt	 "${T1_PROMPT_SYMBOL:-❯}"
	)
}

# Change the colors if their value are different from the current ones.
prompt_t1_set_colors() {
	local color_temp key value
	for key value in ${(kv)prompt_t1_colors}; do
		zstyle -t ":prompt:t1:$key" color "$value"
		case $? in
			1) # The current style is different from the one from zstyle.
				zstyle -s ":prompt:t1:$key" color color_temp
				prompt_t1_colors[$key]=$color_temp ;;
			2) # No style is defined.
				prompt_t1_colors[$key]=$prompt_t1_colors_default[$key] ;;
		esac
	done
}

prompt_t1_precmd() {
  # Identify the directory using a "file:" scheme URL, including
	# the host name to disambiguate local vs. remote paths.

	# Percent-encode the pathname.
	local url_path=''
	{
    # Use LC_CTYPE=C to process text byte-by-byte and
    # LC_COLLATE=C to compare byte-for-byte. Ensure that
    # LC_ALL and LANG are not set so they don't interfere.
    local i ch hexch LC_CTYPE=C LC_COLLATE=C LC_ALL= LANG=
    for ((i = 1; i <= ${#PWD}; ++i)); do
      ch="$PWD[i]"
      if [[ "$ch" =~ [/._~A-Za-z0-9-] ]]; then
          url_path+="$ch"
      else
          printf -v hexch "%02X" "'$ch"
          url_path+="%$hexch"
      fi
    done
	}

	printf '\e]7;%s\a' "file://$HOST$url_path"

  # Modify the colors if some have changed..
  prompt_t1_set_colors

  prompt_t1_state[prompt]=${T1_PROMPT_SYMBOL:-❯}
}

prompt_t1_reset_prompt() {
	if [[ $CONTEXT == cont ]]; then
		# When the context is "cont", PS2 is active and calling
		# reset-prompt will have no effect on PS1, but it will
		# reset the execution context (%_) of PS2 which we don't
		# want. Unfortunately, we can't save the output of "%_"
		# either because it is only ever rendered as part of the
		# prompt, expanding in-place won't work.
		return
	fi

	zle && zle .reset-prompt
}

prompt_t1_setup() {
  # shellcheck disable=SC2166
  if [ -z "${BASH_VERSION}" -a -z "${ZSH_NAME}" ] ; then
    # Only for bash or zsh
    return 0
  fi

  if [[ "$TERM_PROGRAM" != "Terminal_One.app" ]]; then
    return 0
  fi

  # Prevent percentage showing up if output doesn't end with a newline.
	export PROMPT_EOL_MARK=''

  prompt_opts=(subst percent)

  # Borrowed from `promptinit`. Sets the prompt options in case Pure was not
	# initialized via `promptinit`.
	setopt noprompt{bang,cr,percent,subst} "prompt${^prompt_opts[@]}"

	if [[ -z $prompt_newline ]]; then
		# This variable needs to be set, usually set by promptinit.
		typeset -g prompt_newline=$'\n%{\r%}'
	fi

  zmodload zsh/zle
	zmodload zsh/parameter

  autoload -Uz add-zsh-hook

  # Set the colors.
	typeset -gA prompt_t1_colors_default prompt_t1_colors
	prompt_t1_colors_default=(
		execution_time       yellow
		git:arrow            cyan
		git:stash            cyan
		git:branch           242
		git:branch:cached    red
		git:action           yellow
		git:dirty            218
		host                 242
		path                 blue
		prompt:error         red
		prompt:success       magenta
		prompt:continuation  242
		suspended_jobs       red
		user                 242
		user:root            default
		virtualenv           242
	)
	prompt_t1_colors=("${(@kv)prompt_t1_colors_default}")

  add-zsh-hook precmd prompt_t1_precmd
  # precmd_functions+=(prompt_t1_precmd)

  prompt_t1_state_setup

  zle -N prompt_t1_reset_prompt

  # Prompt turns red if the previous command didn't exit with 0.
	local prompt_indicator='%(?.%F{$prompt_t1_colors[prompt:success]}.%F{$prompt_t1_colors[prompt:error]})${prompt_t1_state[prompt]}%f '
	PROMPT=$prompt_indicator
}

prompt_t1_setup "$@"
