#Image Streamer 

##Summary
This application streams instagram images (for a given set of tags) using the instagram real-time API. 

The application also makes use of socket.io to update connected clients of new images in the stream. 

The front-end is built using Bootstrap and AngularJS. 

## Installation 

1. Clone the Repo 

2. This application requires node to be install on your target server/system, all other dependencies should be loaded 
in with a call to npm install on the command line

3. you will need to set some environment vars on your target server, the variables required are as follows: 

* HOST_URL (this is the URL of your host server, including protocol and port number, you will need to set up an instagram app and allow this)
* CLIENT_ID  (this is the client id required for running applications using the instagram API)
* CLIENT_SECRET  (you can obtain this by registering a new app), register your account and create your application here: 

https://instagram.com/developer/clients/register/

4) In your instagram client settings, you will have to register the following redirect URIs 

<your host URL>/api 
<your host URL>/api/user/authorize 
<your host URL>/api/user/authorize/redirect 
<your host URL>api/subscription 
<your host URL>/api/subscription/new

To register your application, follow the instructions here: 
https://instagram.com/developer/

##Demo 
I've provided a live demo on heroku, you can find it here 
https://mike-s-imagestreamer.herokuapp.com

Please view the package.json for full set of dependencies. 

After following these steps, you should be good to go! 



