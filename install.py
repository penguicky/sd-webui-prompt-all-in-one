import launch

packages = {
    "chardet": "chardet",
    "fastapi": "fastapi",
    "execjs": "PyExecJS",
    "lxml": "lxml",
    "tqdm": "tqdm",
    "pathos": "pathos",
    "cryptography": "cryptography",
}

if __name__ == "__main__":
    for package_name in packages:
        package = packages[package_name]
        try:
            if not launch.is_installed(package_name):
                launch.run_pip(f"install {package}", f"sd-webui-prompt-all-in-one: {package_name}")
        except Exception as e:
            print(e)
            print(f'Warning: Failed to install {package}, some preprocessors may not work.')