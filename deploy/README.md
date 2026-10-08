# Deploy — Document Generation Portal

## Build and run

From the repo root:

    cd deploy
    docker compose up --build -d

The portal is served at http://localhost:4204/.

## Stop

    cd deploy
    docker compose stop

## Start again (without rebuild)

    cd deploy
    docker compose start

## Tear down (remove container and image)

    cd deploy
    docker compose down --rmi local

## Image tagging

The compose file uses IMAGE_TAG with a default of `dev`. To build a
specific tag:

    IMAGE_TAG=v1.0.0 docker compose up --build -d

This keeps the container name and image tag in sync with the release
version, so the running container can be traced back to a specific
build. Without IMAGE_TAG, the default `dev` tag is used for local work.

## Verifying the shell fallback

With the shell (telemed-ia-front) running on http://localhost:4200 and
this container up, navigate to http://localhost:4200/documents — the
portal loads.

Then:

    docker compose stop

Refresh the browser. The shell shows "Este portal no está disponible en
este momento. El resto de la aplicación sigue funcionando." The rest of
the shell keeps working. This is the demonstration required for the
checkpoint.

Restart the container:

    docker compose start

Refresh again. The portal loads again.
