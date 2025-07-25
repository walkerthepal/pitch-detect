# README

## ToDo
- Add a dark mode

## About

Application for pitch detection. Backend written with golang. Frontend uses wails to run react for display.

## Building 

To build this project in debug mode, use `wails build`. For production, use `wails build -production`.
To generate a platform native package, add the `-package` flag.

export CGO_CFLAGS="-I/opt/homebrew/opt/aubio/include"
export CGO_LDFLAGS="-L/opt/homebrew/opt/aubio/lib -laubio"

## Live Development

To run in live development mode, run `wails dev` in the project directory. In another terminal, go into the `frontend` 
directory and run `npm run dev`. The frontend dev server will run on http://localhost:34115. Connect to this
in your browser and connect to your application. 
