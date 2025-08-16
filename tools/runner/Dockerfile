FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates openssl \
    ripgrep universal-ctags sqlite3 python3 \
    dumb-init \
 && rm -rf /var/lib/apt/lists/*

# optional for later (hybrid search)
RUN npm i -g tree-sitter-cli@0.22.x

# playwright for smoke tests if you use them
RUN npx -y playwright@1.46.0 install --with-deps chromium

RUN useradd -m -u 10001 appuser
USER appuser
WORKDIR /workspace

ENTRYPOINT ["dumb-init","--"]
CMD ["bash","-lc","node -v && rg --version && sqlite3 --version"]
