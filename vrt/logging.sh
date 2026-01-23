#! /bin/bash

# Logging (ERROR=0, WARN=1, INFO=2, DEBUG=3)
LOG_LEVEL=${LOG_LEVEL:-INFO}
case "$LOG_LEVEL" in
    ERROR) LOG_LEVEL_NUM=0 ;;
    WARN) LOG_LEVEL_NUM=1 ;;
    INFO) LOG_LEVEL_NUM=2 ;;
    DEBUG) LOG_LEVEL_NUM=3 ;;
    *) LOG_LEVEL_NUM=2 ;;
esac

log_msg() {
    level="$1"
    shift
    msg="$*"
    case "$level" in
        ERROR) level_num=0 ;;
        WARN) level_num=1 ;;
        INFO) level_num=2 ;;
        DEBUG) level_num=3 ;;
        *) level_num=2 ;;
    esac
    if [ "$level_num" -le "$LOG_LEVEL_NUM" ]; then
        echo "[$level] $msg"
    fi
}
