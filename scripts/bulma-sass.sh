#!/bin/bash

WEB_PATH=./web
BULMA_PATH=$WEB_PATH/bulma-0.8.0
BULMA_URL=https://github.com/jgthms/bulma/releases/download/0.8.0/bulma-0.8.0.zip
SASS_FILE=$WEB_PATH/sass/custom.scss
CSS_FILE=$WEB_PATH/css/custom.css

if [ ! -d $BULMA_PATH ]; then
    wget $BULMA_URL
    unzip bulma-0.8.0.zip -d $WEB_PATH
    rm bulma-0.8.0.zip
fi

sass --watch $SASS_FILE:$CSS_FILE