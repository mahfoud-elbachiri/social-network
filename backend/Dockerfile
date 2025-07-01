# ----------- Build Stage -----------
FROM golang:1.23.5-alpine AS builder

WORKDIR /app

RUN apk add --no-cache gcc musl-dev sqlite-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o server ./main

# ----------- Runtime Stage -----------
FROM alpine:latest

 
WORKDIR /app

 
RUN mkdir -p ../frontend/public/avatars
RUN mkdir -p ../frontend/public/avatars2
RUN mkdir -p /app/images/uploads/group_posts
RUN mkdir -p /app/images/uploads/group_comments
RUN mkdir -p ./Database


COPY --from=builder /app/server .

COPY ./Database/migrations ./Database/migrations

ENV DOCKER_ENV=true

EXPOSE 8080

CMD ["./server"]