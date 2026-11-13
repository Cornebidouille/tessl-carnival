#!/bin/sh
# SessionStart hook: run `tessl install` so plugins set to "latest" (and GitHub
# sources with no pinned commit) arrive without anyone running it by hand.
#
# Skipped in Tessl cloud runs and SDK sessions. There, the automation's own
# plugin sits in .tessl/plugins without being declared in tessl.json, and
# `tessl install` removes undeclared plugins.

[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
[ -d .cloud-launch ] && exit 0
case "${CLAUDE_CODE_ENTRYPOINT:-}" in sdk*) exit 0 ;; esac
command -v tessl >/dev/null 2>&1 || exit 0

GITHUB_TOKEN="${GITHUB_TOKEN:-$(gh auth token 2>/dev/null)}"
export GITHUB_TOKEN
limit="${TESSL_INSTALL_TIMEOUT:-45}" # keep under the hook's 60 s timeout

if command -v perl >/dev/null 2>&1; then
  # On timeout send SIGTERM: the npm and Homebrew launchers forward only
  # INT, TERM and HUP to the real binary.
  perl -e '
    my $t = shift;
    my $pid = fork;
    defined $pid or exit 1;
    if (!$pid) { exec @ARGV; exit 127 }
    $SIG{ALRM} = sub { kill "TERM", $pid; waitpid $pid, 0; exit 124 };
    alarm $t;
    waitpid $pid, 0;
    exit($? >> 8);
  ' "$limit" tessl install --yes >/dev/null 2>&1
else
  tessl install --yes >/dev/null 2>&1
fi && exit 0

# systemMessage is shown to the user; plain stdout would only reach the model.
echo '{"systemMessage": "tessl install failed or took too long, so installed skills may be out of date. Run tessl install in a terminal to see why."}'
