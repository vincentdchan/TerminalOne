
if [[ -f $USER_ZDOTDIR/.zshenv ]]; then
	T1_ZDOTDIR=$ZDOTDIR
	ZDOTDIR=$USER_ZDOTDIR

	# prevent recursion
	if [[ $USER_ZDOTDIR != $T1_ZDOTDIR ]]; then
		. $USER_ZDOTDIR/.zshenv
	fi

	USER_ZDOTDIR=$ZDOTDIR
	ZDOTDIR=$T1_ZDOTDIR
fi
