#!/bin/bash

# author: Duane Johnson
# email: duane.johnson@gmail.com
# date: 2008 Jun 12
# license: MIT
# 
# Based on discussion at http://kerneltrap.org/mailarchive/git/2007/11/12/406496


# Find base of git directory
while [ ! -d .git ] && [ ! `pwd` = "/" ]; do cd ..; done

# Show various information about this git directory
if [ -d .git ]; then
  echo "\n== Listes des remotes URL: `git remote -v`"

  echo "\n== Remote Branches: "
  git branch -r
  echo

  echo "== Local Branches:"
  git branch
  echo

  echo "== Configuration (.git/config)"
  cat .git/config
  echo

  echo "== Most Recent Commit\n"
  git log --max-count=1
  echo

  echo "\n==============================="
  echo "     Git status du depot"
  echo "===============================\n"

  git status

  echo "Faire un 'git log' pour voir plus de commits, ou 'git show' Pour plus de détails sur les commits.\n\n"
else
  echo "Not a git repository."
fi
