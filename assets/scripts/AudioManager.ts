import { _decorator, Component, Node, AudioClip, AudioSource, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static _instance: AudioManager | null = null;

    public static get instance(): AudioManager {
        return this._instance!;
    }

    @property(AudioClip) bgPlay: AudioClip | null = null;
    @property(AudioClip) blockBreak: AudioClip | null = null;
    @property(AudioClip) blockDown: AudioClip | null = null;
    @property(AudioClip) blockMatch: AudioClip | null = null;
    @property(AudioClip) blockUp: AudioClip | null = null;
    @property(AudioClip) clickBtn: AudioClip | null = null;
    @property(AudioClip) outOfTime: AudioClip | null = null;
    @property(AudioClip) pictureCollect: AudioClip | null = null;
    @property(AudioClip) timerWarningCount: AudioClip | null = null;
    @property(AudioClip) timerWarningEnd: AudioClip | null = null;
    @property(AudioClip) winLevel: AudioClip | null = null;

    private audioSource: AudioSource = null!;

    onLoad() {
        if (AudioManager._instance) {
            this.node.destroy();
            return;
        }
        AudioManager._instance = this;
        director.addPersistRootNode(this.node); // Giữ nguyên qua các scene

        this.audioSource = this.node.addComponent(AudioSource);
    }

    start() {
        this.playBGM();
    }

    public playBGM() {
        if (this.bgPlay) {
            this.audioSource.clip = this.bgPlay;
            this.audioSource.loop = true;
            this.audioSource.play();
        }
    }

    public stopBGM() {
        this.audioSource.stop();
    }

    public playSound(clip: AudioClip | null, volume: number = 1.0) {
        if (clip) {
            this.audioSource.playOneShot(clip, volume);
        }
    }

    public playBlockBreak() { this.playSound(this.blockBreak); }
    public playBlockDown() { this.playSound(this.blockDown); }
    public playBlockMatch() { this.playSound(this.blockMatch); }
    public playBlockUp() { this.playSound(this.blockUp); }
    public playClickBtn() { this.playSound(this.clickBtn); }
    public playOutOfTime() { this.playSound(this.outOfTime); }
    public playPictureCollect() { this.playSound(this.pictureCollect); }
    public playTimerWarningCount() { this.playSound(this.timerWarningCount); }
    public playTimerWarningEnd() { this.playSound(this.timerWarningEnd); }
    public playWinLevel() { this.playSound(this.winLevel); }
}
