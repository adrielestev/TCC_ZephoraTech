#pragma once
#include <string>

#include "../../src/core/channel.h"

struct FakeLight : zephora::Channel {
  std::string id_, name_;
  bool on = false;
  FakeLight(std::string i, std::string n) : id_(std::move(i)), name_(std::move(n)) {}
  const char* id() const override { return id_.c_str(); }
  const char* name() const override { return name_.c_str(); }
  zephora::DeviceType type() const override { return zephora::DeviceType::Light; }
  bool state() const override { return on; }
  bool setState(bool v) override { on = v; return true; }
};

struct FakePir : zephora::Channel {
  std::string id_, name_;
  bool presence = false;
  FakePir(std::string i, std::string n) : id_(std::move(i)), name_(std::move(n)) {}
  const char* id() const override { return id_.c_str(); }
  const char* name() const override { return name_.c_str(); }
  zephora::DeviceType type() const override { return zephora::DeviceType::PresenceSensor; }
  bool state() const override { return presence; }
};
