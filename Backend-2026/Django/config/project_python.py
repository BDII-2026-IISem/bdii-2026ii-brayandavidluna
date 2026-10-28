import os
import sys


def use_project_python():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if os.name == "nt":
        venv_python = os.path.join(project_root, ".venv", "Scripts", "python.exe")
    else:
        venv_python = os.path.join(project_root, ".venv", "bin", "python")

    current_python = os.path.normcase(os.path.abspath(sys.executable))
    project_python = os.path.normcase(os.path.abspath(venv_python))

    if os.path.isfile(venv_python) and current_python != project_python:
        os.execv(venv_python, [venv_python] + sys.argv)
