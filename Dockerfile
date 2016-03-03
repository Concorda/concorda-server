FROM node

ADD . /
RUN npm install

CMD ["node", "start.js", "--seneca.log=level:info"]