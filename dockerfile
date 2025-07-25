# Use Go base image
FROM golang:1.21

# Install essential build tools and dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libasound2-dev \
    portaudio19-dev \
    libaubio-dev \
    curl \
    git \
    build-essential \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Wails
RUN go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Set up working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download Go dependencies
RUN go mod download

# Copy the rest of the application
COPY . .

# Set CGO flags for aubio
ENV CGO_CFLAGS="-I/usr/include"
ENV CGO_LDFLAGS="-L/usr/lib"

# Set PATH to include Go binaries
ENV PATH="/go/bin:${PATH}"

# Expose default Wails development port
EXPOSE 34115

# Command to run Wails in development mode
CMD ["wails", "dev"]
