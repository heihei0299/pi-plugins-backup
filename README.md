# Pi plugins backup

保存当前机器的 Pi 配置和扩展快照，可用于同步或恢复。

## 内容

- `packages.json`：固定的 npm 版本与 Git commit。
- `extensions/`：当前使用的本地扩展。
- `config/`：非敏感设置。
- `legacy/`：不再启用的旧扩展。

依赖目录、会话、缓存、凭据、模型存储和机器集成文件不会纳入备份。

## 同步与恢复

默认从 `~/.pi/agent` 同步：

~~~sh
pnpm sync
PI_AGENT_DIR=/path/to/.pi/agent pnpm sync
~~~

恢复到该目录：

~~~sh
pnpm restore
~~~

恢复会安装固定版本的包和本地扩展，但不会覆盖认证信息、模型凭据、会话、缓存或其他未跟踪状态。活动包清单以 `config/settings.json` 为准；本地扩展源位于 `extensions/`。