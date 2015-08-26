#!/bin/sh

set -x

ROOT=$(git rev-parse --show-toplevel)

ln -sf $ROOT/dev/pre-commit $ROOT/.git/hooks/pre-commit

