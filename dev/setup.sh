#!/bin/sh

set -x

ROOT=$(git rev-parse --show-toplevel)

cp $ROOT/dev/pre-commit $ROOT/.git/hooks/pre-commit

