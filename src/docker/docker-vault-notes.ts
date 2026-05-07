// Curated from Obsidian vault: zprezto-module-docker.md (196 lines)
// Source: Zprezto Docker module alias reference — user's curated shell alias cheatsheet.
// Note: docker.md and docker-compose.md in vault are upstream READMEs; all personal
// content comes from the zprezto module documentation.

export interface VaultNote {
  heading: string;
  body: string;
  tags?: string[];
  codeSnippet?: string;
}

export const DOCKER_VAULT_NOTES: VaultNote[] = [
  {
    heading: 'Zprezto Docker Aliases — Core Commands (dk)',
    body: 'Core Docker CLI shortcuts from the Zprezto docker module.',
    tags: ['aliases', 'docker', 'zprezto'],
    codeSnippet: `dk    # short for docker
dka   # attach to a running container
dkb   # build an image from a Dockerfile
dkd   # inspect changes on a container's filesystem
dkdf  # show docker filesystem usage
dke   # run a command in a running container
dkE   # run an interactive command in a running container
dkh   # show the history of an image
dki   # list images
dkin  # return low-level information on a container, image or task
dkk   # kill a running container
dkl   # fetch the logs of a container
dkli  # log in to a Docker registry
dklo  # log out from a Docker registry
dkp   # pause all processes within one or more containers
dkP   # unpause all processes within one or more containers
dkpl  # pull an image or a repository from a registry
dkph  # push an image or a repository to a registry
dkps  # list containers (running)
dkpsa # list all containers (including stopped)
dkr   # run a command in a new container
dkR   # run an interactive command in a new container (auto-removes on exit)
dkRe  # like dkR but sets entry point to /bin/bash
dkrm  # remove one or more containers
dkrmi # remove one or more images
dkrmC # clean up exited containers
dkrmI # clean up dangling images
dkrmV # clean up unused volumes (Docker >= 1.9)
dkrn  # rename a container
dks   # start one or more stopped containers
dkS   # restart a container
dkss  # display a live stream of container(s) resource usage statistics
dksv  # save one or more images to a tar archive
dkt   # tag an image into a repository
dktop # display the running processes of a container
dkup  # update configuration of one or more containers
dkV   # manage Docker volumes
dkv   # show the Docker version information
dkw   # block until a container stops, then print its exit code
dkx   # stop a running container`,
  },
  {
    heading: 'Zprezto Docker Aliases — Container Subcommands (dkC)',
    body: 'Extended container management using the "docker container" subcommand style.',
    tags: ['aliases', 'container', 'zprezto'],
    codeSnippet: `dkC    # manage containers
dkCa   # attach to a running container
dkCcp  # copy files/folders between a container and the local filesystem
dkCd   # inspect changes on a container's filesystem
dkCe   # run a command in a running container
dkCin  # display detailed information on one or more containers
dkCk   # kill one or more running containers
dkCl   # fetch the logs of a container
dkCls  # list containers
dkCp   # pause all processes within one or more containers
dkCpr  # remove all stopped containers
dkCrn  # rename a container
dkCS   # restart one or more containers
dkCrm  # remove one or more containers
dkCr   # run a command in a new container
dkCR   # run an interactive command in a new container (auto-removes on exit)
dkCRe  # like dkCR but sets entry point to /bin/bash
dkCs   # start one or more stopped containers
dkCss  # display a live stream of resource usage statistics
dkCx   # stop one or more running containers
dkCtop # display the running processes of a container
dkCP   # unpause all processes within one or more containers
dkCup  # update configuration of one or more containers
dkCw   # block until one or more containers stop`,
  },
  {
    heading: 'Zprezto Docker Aliases — Image, Volume & Network (dkI, dkV, dkN)',
    body: 'Image, volume, and network management shortcuts.',
    tags: ['aliases', 'image', 'volume', 'network', 'zprezto'],
    codeSnippet: `# Image (dkI)
dkI    # manage images
dkIb   # build an image from a Dockerfile
dkIh   # show the history of an image
dkIin  # display detailed information on one or more images
dkIls  # list images
dkIpr  # remove unused images
dkIpl  # pull an image or a repository from a registry
dkIph  # push an image or a repository to a registry
dkIrm  # remove one or more images
dkIsv  # save one or more images to a tar archive
dkIt   # tag an image into a repository

# Volume (dkV)
dkVin  # display detailed information on one or more volumes
dkVls  # list volumes
dkVpr  # remove all unused volumes
dkVrm  # remove one or more volumes

# Network (dkN)
dkN    # manage networks
dkNs   # connect a container to a network
dkNx   # disconnect a container from a network
dkNin  # display detailed information on a network
dkNls  # list all the networks created by the user
dkNpr  # remove all unused networks
dkNrm  # delete one or more networks`,
  },
  {
    heading: 'Zprezto Docker Aliases — Compose (dkc)',
    body: 'Docker Compose shortcuts via the Zprezto docker module.',
    tags: ['aliases', 'compose', 'zprezto'],
    codeSnippet: `dkc    # short for docker-compose
dkcb   # build or rebuild services
dkcB   # build or rebuild services (no cache)
dkcd   # stop and remove containers, networks, images, and volumes
dkce   # execute a command in a running container
dkck   # kill containers
dkcl   # view output from containers
dkcls  # list containers (alias for dkcps)
dkcp   # pause services
dkcP   # unpause services
dkcpl  # pull service images
dkcph  # push service images
dkcps  # list containers
dkcr   # run a one-off command
dkcR   # run a one-off command and remove container after run
dkcrm  # remove stopped containers
dkcs   # start services
dkcsc  # set number of containers for a service
dkcS   # restart services
dkcu   # create and start containers
dkcU   # create and start containers in detached mode
dkcV   # show the Docker-Compose version information
dkcx   # stop services`,
  },
  {
    heading: 'Zprezto Docker Aliases — System & Stack (dkY, dkK)',
    body: 'Docker system management and stack/swarm shortcuts.',
    tags: ['aliases', 'system', 'stack', 'zprezto'],
    codeSnippet: `# System (dkY)
dkY    # manage Docker system
dkYdf  # show docker filesystem usage
dkYpr  # remove unused data

# Stack (dkK)
dkK    # manage Docker stacks
dkKls  # list stacks
dkKps  # list the tasks in the stack
dkKrm  # remove the stack

# Swarm (dkW)
dkW    # manage Docker Swarm`,
  },
];

// Re-export as DOCKER_COMPOSE_VAULT_NOTES for docker-compose tool
// (all compose aliases are in the same vault file)
export const DOCKER_COMPOSE_VAULT_NOTES: VaultNote[] = [
  {
    heading: 'Zprezto Docker Compose Aliases (dkc)',
    body: 'Docker Compose shortcuts from the Zprezto docker module. See the Docker notes tab for full context.',
    tags: ['aliases', 'compose', 'zprezto'],
    codeSnippet: `dkc    # short for docker-compose
dkcb   # build or rebuild services
dkcB   # build or rebuild services (no cache)
dkcd   # stop and remove containers, networks, images, and volumes
dkce   # execute a command in a running container
dkck   # kill containers
dkcl   # view output from containers
dkcp   # pause services
dkcP   # unpause services
dkcpl  # pull service images
dkcps  # list containers
dkcr   # run a one-off command
dkcR   # run a one-off command and remove container after run
dkcrm  # remove stopped containers
dkcs   # start services
dkcS   # restart services
dkcu   # create and start containers (foreground)
dkcU   # create and start containers in detached mode
dkcx   # stop services`,
  },
  {
    heading: 'Docker Compose Quick Reference',
    body: 'Common docker compose workflow patterns.',
    tags: ['workflow', 'compose'],
    codeSnippet: `# Start all services in the background
docker compose up -d

# View logs for a specific service
docker compose logs -f <service>

# Run a one-off command in a service container
docker compose run --rm <service> <command>

# Rebuild and restart a single service
docker compose up -d --build <service>

# Scale a service
docker compose up -d --scale <service>=3

# Stop everything and remove volumes
docker compose down -v`,
  },
];
