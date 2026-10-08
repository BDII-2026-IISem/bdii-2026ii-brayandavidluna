import os
import sys


def use_project_python():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    venv_python = os.path.join(project_root, ".venv", "bin", "python")

    current_python = os.path.abspath(sys.executable)

    if os.path.exists(venv_python) and current_python != os.path.abspath(venv_python):
        os.execv(venv_python, [venv_python] + sys.argv[1:])
