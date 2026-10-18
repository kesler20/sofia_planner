"""Run adapter tests against an owned Redis emulator with its real Lua runtime."""

import os
import pathlib
import subprocess
import threading

import fakeredis


def main() -> int:
    """Bind only loopback and tear down the synthetic server after verification."""
    server = fakeredis.TcpFakeServer(("127.0.0.1", 0), server_type="redis")
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    environment = {**os.environ, "SOFIA_TEST_REDIS_PORT": str(server.server_address[1])}
    try:
        result = subprocess.run(
            ["node", "tests/run-redis-tests.cjs"],
            cwd=pathlib.Path(__file__).resolve().parents[1],
            env=environment,
            check=False,
        )
        return result.returncode
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


if __name__ == "__main__":
    raise SystemExit(main())
