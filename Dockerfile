FROM ubuntu:latest
MAINTAINER Vitor Baptista <vitor@vitorbaptista.com>

ENV DEBIAN_FRONTEND noninteractive

RUN echo "deb http://archive.ubuntu.com/ubuntu precise universe" >> /etc/apt/sources.list

# PPA for NodeJS and NPM
RUN apt-get install python-software-properties -y
RUN add-apt-repository ppa:chris-lea/node.js -y

# MongoDB
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/10gen.list
RUN dpkg-divert --local --rename --add /sbin/initctl
RUN ln -s /bin/true /sbin/initctl

RUN apt-get update
RUN apt-get upgrade -y

RUN apt-get install build-essential nodejs mongodb-org -q -y

# MongoDB
RUN mkdir -p /data/db

