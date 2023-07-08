
if [[ $options[norcs] = off && -o "login" &&  -f $USER_ZDOTDIR/.zprofile ]]; then
	T1_ZDOTDIR=$ZDOTDIR
	ZDOTDIR=$USER_ZDOTDIR
	. $USER_ZDOTDIR/.zprofile
	ZDOTDIR=$T1_ZDOTDIR
fi
