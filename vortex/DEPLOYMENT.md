# Vortex deployment notes

Digibuzzer is deployed as a two-service stack. The `web` APP image is the only
HTTP gateway and listens on port 3000. The internal `redis` service has no
published host port. Vortex injects its managed environment only into `web`.

The production administrator must configure `SESSION_KEY` as an encrypted
Vortex `RUNTIME` secret. It is intentionally absent from
`vortex.manifest.json`. Redis is passwordless because it is reachable only on
the per-deployment isolated internal network; `REDIS_URL` contains no secret.

Persistent volumes:

- `avatars` -> `/app/avatars` in `web`
- `redis-data` -> `/data` in `redis`

Both service root filesystems are read-only. Vortex supplies a bounded `/tmp`
tmpfs and the Redis data directory is the only writable persistent mount.

Redis runs with AOF enabled and `appendfsync everysec` so room, score, and HTTP
session data survive service replacement. Uploaded avatars survive separately.

## Pinned OCI provenance

The Redis sidecar reference is the immutable multi-platform OCI index digest
for Docker Official Image `redis:7.4.6-bookworm`:

`docker.io/library/redis@sha256:a9cc41d6d01da2aa26c219e4f99ecbeead955a7b656c1c499cce8922311b2514`

It was resolved on 18 July 2026 with:

```text
docker buildx imagetools inspect docker.io/library/redis:7.4.6-bookworm
```

The index identifies Redis 7.4.6 and includes Linux/amd64 manifest
`sha256:6a11fed904cf317684ebb75bfe987d4f777c605d6f4e98d1bf3066db6c58f0c1`.
The Dockerfile likewise pins the Node 24.4.1 Bookworm Slim OCI index digest.
