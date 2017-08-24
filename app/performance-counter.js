export default class PerformanceCounter {
    constructor() {
        this.currentFps = 0;
        this.averageDuration = 0;
        this.tickNum = 0;
    }

    update(elapsed) {
        this.averageDuration = this.recalculateAverageDuration(this.averageDuration, this.tickNum, elapsed);
        this.tickNum += 1;
        this.currentFps = 1000 / elapsed;
    }

    get fps() {
        return this.currentFps;
    }

    get average() {
        return this.averageDuration;
    }

    recalculateAverageDuration(avgDuration, tickNum, elapsed) {
        return ((avgDuration * tickNum) + elapsed) / (tickNum + 1);
    }
}
