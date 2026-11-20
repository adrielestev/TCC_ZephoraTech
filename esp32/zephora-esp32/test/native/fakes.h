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
  uint32_t holdMs = 0;
  uint32_t warmupMs = 0;
  bool executionConfigApplied = false;
  FakePir(std::string i, std::string n) : id_(std::move(i)), name_(std::move(n)) {}
  const char* id() const override { return id_.c_str(); }
  const char* name() const override { return name_.c_str(); }
  zephora::DeviceType type() const override { return zephora::DeviceType::PresenceSensor; }
  bool state() const override { return presence; }
  bool setExecutionConfig(JsonObjectConst config) override {
    if (config.size() != 2 ||
        !config["holdMs"].is<uint32_t>() ||
        !config["warmupMs"].is<uint32_t>())
      return false;
    holdMs = config["holdMs"].as<uint32_t>();
    warmupMs = config["warmupMs"].as<uint32_t>();
    executionConfigApplied = true;
    return true;
  }
};
