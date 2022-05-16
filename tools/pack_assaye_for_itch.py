from pathlib import Path
import shutil

root = Path("..")
temp_root = root / "temp"
target = temp_root / "itch_html5"
if(target.exists()):
    shutil.rmtree(target)
target.mkdir()
scenario_target = target / "scenario"
scenario_target.mkdir(exist_ok=True)



shutil.copy(root / "game.html", target / "index.html")
shutil.copy(root / "scenario/Assaye.js", scenario_target / "output.js")

ignores = shutil.ignore_patterns("d3", "handsontable")

shutil.copytree(root / "css", target / "css", ignore=ignores)
shutil.copytree(root / "js", target / "js", ignore=ignores)

shutil.make_archive(temp_root / "itch_html5_release", "zip", target)
