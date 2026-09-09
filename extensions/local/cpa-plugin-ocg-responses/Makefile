PLUGIN := ocg-responses
GOOS ?= linux
GOARCH ?= amd64
OUTDIR ?= build/$(GOOS)/$(GOARCH)

.PHONY: build clean

build:
	mkdir -p $(OUTDIR)
	CGO_ENABLED=1 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -trimpath -buildmode=c-shared -o $(OUTDIR)/$(PLUGIN).so .
	rm -f $(OUTDIR)/$(PLUGIN).h

clean:
	rm -rf build
