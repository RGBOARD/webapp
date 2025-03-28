To run app.py:

1. Create a virtual environment:

    ````sh
    python -m venv env
    ````

2. Activate the virtual environment:

    Windows users (powershell):

    ```sh
    .\env\Scripts\activate
    ```

    If it gives an error due to scripts being disabled, open Powershell as admin and run this command first:

    ```sh
    Set-ExecutionPolicy RemoteSigned
    ```

    If using Linux/Mac:

    ```sh
    source env\bin\activate
    ```

3. Make sure you have java installed:

    If using Linux:

    ```sh
    sudo apt-get install default-jre
    which java
    ```

    If using Mac/brew:

    ```sh
    brew install java
    ```

    If using Windows: Download and install Java from Oracle's website

4. Install python libraries inside the created virtual environment

    ```sh
    pip install -r requirements.txt
    ```

5. If you are on vscode, remember to set the python interpreter to the created environment's python version.

6. After python env is ready, create the database: 
    ```sh
    python utilities/create.py 
    ```
7. Make sure that the api address in ```axios.jsx``` is the one from your device. Example:
    ```sh
    "http://127.0.0.1:5000"
    ```

Now cd into the frontend:
1. ```cd view```
2. ```⁠npm install```
3. ⁠Make sure the /backend is running in another terminal using: ```python app.py``` or ```flask run```
4. ⁠Run frontend: ```npm run dev```

