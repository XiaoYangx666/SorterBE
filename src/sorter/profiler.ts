import { intervalBus } from "sapi-pro/Event";

type PlayerId = string;

interface RecordItem {
	time: number; // 时间戳
	duration: number; // 耗时（ms）
}

interface StatsOptions {
	windowMs?: number; // 统计窗口（默认 5 分钟）
	maxRecords?: number; // 每个玩家最大记录数（防爆内存）
}

class SorterProfiler {
	private data = new Map<PlayerId, RecordItem[]>();
	private windowMs: number;
	private maxRecords: number;

	constructor(options: StatsOptions = {}) {
		this.windowMs = options.windowMs ?? 5 * 60 * 1000; // 默认5分钟
		this.maxRecords = options.maxRecords ?? 100;
	}

	start() {
		intervalBus.subscribemin(() => this.cleanup());
	}

	/** 记录一次整理 */
	record(playerId: PlayerId, start: number, end: number) {
		let list = this.data.get(playerId);

		if (!list) {
			list = [];
			this.data.set(playerId, list);
		}

		list.push({ time: end, duration: end - start });

		// 控制长度（防止极端玩家刷爆）
		if (list.length > this.maxRecords) {
			list.shift();
		}

		this.cleanupPlayer(list, end);
	}

	/** 清理单个玩家过期数据 */
	private cleanupPlayer(list: RecordItem[], now: number) {
		const expire = now - this.windowMs;

		while (list.length && list[0].time < expire) {
			list.shift();
		}
	}

	/** 全局清理（可定期调用） */
	cleanup() {
		const now = Date.now();
		for (const [key, list] of this.data) {
			this.cleanupPlayer(list, now);
			if (list.length === 0) {
				this.data.delete(key);
			}
		}
	}

	/** 最近窗口内平均耗时 */
	getAverageTime(): number {
		let total = 0;
		let count = 0;

		for (const list of this.data.values()) {
			for (const r of list) {
				total += r.duration;
				count++;
			}
		}

		return count === 0 ? 0 : total / count;
	}

	/** 最近窗口内总次数 */
	getTotalCount(): number {
		let count = 0;
		for (const list of this.data.values()) {
			count += list.length;
		}
		return count;
	}

	/** 找到平均耗时最高的玩家 */
	getSlowestPlayer(): { playerId: PlayerId; avg: number } | undefined {
		let maxAvg = 0;
		let result: PlayerId | undefined;

		for (const [playerId, list] of this.data) {
			if (!list.length) continue;

			let total = 0;
			for (const r of list) total += r.duration;

			const avg = total / list.length;
			if (avg > maxAvg) {
				maxAvg = avg;
				result = playerId;
			}
		}

		if (!result) return undefined;
		return { playerId: result, avg: maxAvg };
	}

	/** 找到单次耗时最长的玩家 */
	getMaxSingle(): { playerId: PlayerId; duration: number } | undefined {
		let max = 0;
		let result: PlayerId | undefined;

		for (const [playerId, list] of this.data) {
			for (const r of list) {
				if (r.duration > max) {
					max = r.duration;
					result = playerId;
				}
			}
		}

		if (!result) return undefined;
		return { playerId: result, duration: max };
	}

	/** 获取某玩家平均耗时 */
	getPlayerAverage(playerId: PlayerId): number {
		const list = this.data.get(playerId);
		if (!list || list.length === 0) return 0;

		let total = 0;
		for (const r of list) total += r.duration;

		return total / list.length;
	}
}

export const profiler = new SorterProfiler();
