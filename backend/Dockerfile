# ----------- Build Stage -----------
FROM golang:1.23.5-alpine AS builder

WORKDIR /app

RUN apk add --no-cache gcc musl-dev sqlite-dev


COPY go.mod go.sum ./
RUN go mod download


COPY . .


RUN go build -o server ./main



FROM alpine:latest

WORKDIR /root


RUN mkdir -p ./Database


COPY --from=builder /app/server .


COPY ./Database/social-network.db ./Database/social-network.db

COPY ./Database/migrations ./Database/migrations


EXPOSE 8080

CMD ["./server"]
