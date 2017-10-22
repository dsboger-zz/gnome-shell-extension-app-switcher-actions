#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.69])
AC_INIT([GNOME Shell Extension App Switcher Actions], [3], [https://github.com/dsboger/gnome-shell-extension-app-switcher-actions/issues], [gnome-shell-extension-app-switcher-actions], [https://github.com/dsboger/gnome-shell-extension-app-switcher-actions])
AC_CONFIG_SRCDIR([src/extension.js])
AC_CONFIG_AUX_DIR([acaux])

AC_ARG_VAR([localprefix], [])
: ${localprefix=$HOME/.local/share/gnome-shell/extensions}
AC_SUBST([localprefix])

AC_ARG_VAR([uuid], [])
: ${uuid=gnome-shell-extension-app-switcher-actions.dsboger@gmail.com}
AC_SUBST([uuid])

# Checks for programs.
AC_PROG_INSTALL
AM_GNU_GETTEXT([external])
AM_GNU_GETTEXT_VERSION([0.19.7])

AM_INIT_AUTOMAKE([1.15 foreign])
AC_CONFIG_FILES([Makefile src/Makefile schemas/Makefile po/Makefile.in])
AC_OUTPUT
