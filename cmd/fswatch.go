package main

import (
	"log"
	"time"

	"github.com/fsnotify/fsevents"
)

func fswatch(path string) (*chan string, error) {
	// if err != nil {
	// 	log.Fatalf("Failed to create TempDir: %v", err)
	// }
	dev, err := fsevents.DeviceForPath(path)
	if err != nil {
		return nil, err
	}

	log.Print(dev)
	log.Println(fsevents.EventIDForDeviceBeforeTime(dev, time.Now()))

	es := &fsevents.EventStream{
		Paths:   []string{path},
		Latency: 500 * time.Millisecond,
		Device:  dev,
		Flags:   fsevents.FileEvents | fsevents.WatchRoot}
	es.Start()
	ec := es.Events

	events := make(chan string)

	go func() {
		for msg := range ec {
			for _, event := range msg {
				if event.Flags&fsevents.ItemModified == fsevents.ItemModified {
					log.Printf("EventID: %d Path: %s", event.ID, event.Path)
					events <- event.Path
				}
			}
		}
	}()

	return &events, nil
}
