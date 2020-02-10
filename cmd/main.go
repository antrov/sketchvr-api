package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"

	"github.com/gorilla/websocket"
	qrcode "github.com/skip2/go-qrcode"
)

var upgrader = websocket.Upgrader{} // use default options

func echo(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()

	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		log.Printf("recv: %s", message)
		err = c.WriteMessage(mt, message)
		if err != nil {
			log.Println("write:", err)
			break
		}
	}
}

func outboundIP() (*string, error) {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	localIP := localAddr.IP.String()

	return &localIP, nil
}

func marshall(w http.ResponseWriter, r *http.Request) {
	ip, err := outboundIP()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	url := fmt.Sprintf("http://%s:%s", *ip, "8081")

	png, err := qrcode.Encode(url, qrcode.Medium, 1024)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.Write(png)
}

func main() {
	var (
		port = flag.String("p", "8081", "http service port")
		// watch = flag.Bool("w", true, "should watch web folder for changes")
		web = flag.String("a", "public", "path containing served web app")
	)
	flag.Parse()

	// var fschan *chan string

	// if *watch {
	// 	fschan, err := fswatch(*web)
	// 	if err != nil {
	// 		log.Fatalln(err)
	// 	}
	// }

	fs := http.FileServer(http.Dir(*web))

	log.SetFlags(0)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		upgrade := r.Header["Upgrade"]

		if len(upgrade) > 0 && upgrade[0] == "websocket" {
			echo(w, r)
		} else {
			fs.ServeHTTP(w, r)
		}
	})

	http.HandleFunc("/marshall", marshall)

	addr := fmt.Sprintf(":%s", *port)

	log.Fatal(http.ListenAndServe(addr, nil))
}
