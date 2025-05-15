# Use the official Python image as a base
FROM mcr.microsoft.com/devcontainers/python:3.11

# Install Node.js (LTS) and npm
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Set the working directory
WORKDIR /workspaces/quorix
