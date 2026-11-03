# Voice lines

`default/` holds the recordings used for every language. Each file is numbered so its name is unique: `01_good_game.mp3` ... `18_yikes.mp3`.

## Add a language
1. Create a folder named after the two-letter code, e.g. `fr/`.
2. Put the translated recordings in it with the SAME file names as `default/`.
3. In GDevelop, declare each file as an audio resource named `voice/<code>/<file>.mp3` (e.g. `voice/fr/01_good_game.mp3`).
4. In the `Commentator` external events, group "Commentator voice": add an `if Commentator.Language = "<code>"` branch to each line event, playing `voice/<code>/<file>.mp3` (sound actions need a fixed file name, so one branch per line).

The language is the scene variable `Commentator.Language`: `"fr"` plays `voice/fr/`, anything else (empty by default) plays `voice/default/` (English). The browser language is not read (no JavaScript).

## Commentator processing
Every file in `default/` and `fr/` has a broadcast commentator treatment (ffmpeg: band 180 Hz-6 kHz, +6 dB at 2.8 kHz, -3 dB at 350 Hz, compressor 6:1, soft clip, short echo, loudnorm -14 LUFS). `fr/` is also pitched up 6 % before it (`asetrate=44100*1.06,aresample=44100,atempo=0.9434`, same duration). The untreated recordings are kept in `_originals/<lang>/` (not declared as resources): re-apply the treatment from there, never on an already treated file.

## When each line plays (external events `Commentator`)
| Line | Moment |
|---|---|
| 01_good_game | End of the match, player wins |
| 02_goooooal, 06_lets_gooo | Player goal (random) |
| 03_go_go_go | First kickoff (0-0) |
| 03_go_go_go, 05_here_we_go_again, 06_lets_gooo | Puck nearly still for 2 s (random, then at least 10 s before the next one) |
| 04_great, 14_thats_great | Strong player hit (random, chance + cooldown) |
| 05_here_we_go_again | Kickoff after an opponent goal |
| 07_nice, 17_yeahh | Ordinary player hit (random, low chance + cooldown) |
| 08_nice | Player save near their own goal |
| 09_nooo, 18_yikes | Opponent shot hits the end wall right next to the player's goal (random) |
| 10_nothing_but_net | Player goal with no wall bounce since the player's touch |
| 11_not_bad | Defeat, player scored 3+ |
| 12_oh_noo | Defeat, player scored 0 |
| 13_scored | Player goal after a rally of 3+ player touches |
| 15_thats_terrible | Player shot hits the goal frame without scoring; opponent scores twice in a row; full-speed player swing that passes the puck without touching it |
| 16_what_was_the_plan | Defeat, player scored 1-2 |
