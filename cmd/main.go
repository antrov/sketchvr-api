package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/antrov/sketchvr-api/pkg/cast"
	"github.com/antrov/sketchvr-api/pkg/qrapi"
	"github.com/fsnotify/fsevents"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{} // use default options

const (
	ReloadPayload     cast.TextPayload = "action.reload"
	ScreenshotPayload cast.TextPayload = "action.screenshot"
	StepForward       cast.TextPayload = "action.step.forward"
	StepBackward      cast.TextPayload = "action.step.backward"
)

func socketSend(recv interface{}, msg *cast.EventMessage) {
	conn, valid := recv.(*websocket.Conn)
	if !valid {
		return
	}
	conn.WriteMessage(msg.Type, msg.Payload)
}

func socketListen(w http.ResponseWriter, r *http.Request, bcast *cast.Broadcaster) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade err:", err)
		return
	}

	log.Println("upgrading connection from " + c.LocalAddr().String())

	defer func() {
		bcast.DelClient(c)
		c.Close()
	}()

	bcast.AddClient(c)

	for {
		mt, msg, err := c.ReadMessage()
		if err != nil {
			return
		}
		bcast.Post(c, mt, msg)
	}
}

func qr(w http.ResponseWriter, r *http.Request) {
	png, err := qrapi.PNG(1024)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.Write(png)
}

func watchWeb(path string, b *cast.Broadcaster) {
	dev, err := fsevents.DeviceForPath(path)
	if err != nil {
		log.Fatal(err)
	}

	es := &fsevents.EventStream{
		Paths:   []string{path},
		Latency: 500 * time.Millisecond,
		Device:  dev,
		Flags:   fsevents.FileEvents | fsevents.WatchRoot}
	es.Start()

	ec := es.Events

	go func() {
		for msg := range ec {
			for _, event := range msg {
				if event.Flags&fsevents.ItemModified == fsevents.ItemModified {
					log.Printf("EventID: %d Path: %s", event.ID, event.Path)
					b.Cast(ReloadPayload)
				}
			}
		}
	}()
}

func main() {
	var (
		port  = flag.String("p", "8081", "http service port")
		watch = flag.Bool("watch", true, "should watch web folder for changes")
		web   = flag.String("w", "web", "path containing served web app")
	)
	flag.Parse()

	bcaster := cast.New(socketSend)
	bcaster.Start()

	if *watch {
		watchWeb(*web, bcaster)
	}

	fs := http.FileServer(http.Dir(*web))

	log.SetFlags(0)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		upgrade := r.Header["Upgrade"]

		if len(upgrade) > 0 && upgrade[0] == "websocket" {
			socketListen(w, r, bcaster)
		} else {
			fs.ServeHTTP(w, r)
		}
	})

	http.HandleFunc("/qr", qr)

	addr := fmt.Sprintf(":%s", *port)

	log.Fatal(http.ListenAndServe(addr, nil))
}
