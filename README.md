#### Running the Backend

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

6. After python env is ready, database must be created in the root folder (```/backend```): 
    ```sh
    python utilities/create.py 
    ```

7. Run the server (in its own terminal):
    ```sh
    python app.py
    ```

#### Running the Web App (Frontend)

1. Navigate to the frontend directory (in its own terminal):
   ```sh
   cd view
   ```

2. Install dependencies:
   ```sh
   npm install
   ```
   
3. Run the development server:
   ```sh
   npm run dev
   ```

#### After Sign Up and Log in
1. **Without credentials file:** Open your database application and check the `VerificationCode` table to find the code associated with the newly created account.

2. **With credentials file:** You should receive an email containing the verification code.

#### Fetching PRs
1. Fetch the PR and create a local branch on your device. For example, PR #15:
    ```sh
    git fetch origin pull/15/head:pr-15
    ```

2. Switch to the PR branch.
    ```sh
    git checkout pr-15
    ```

3. To refresh a PR branch with the latest changes:
    ```sh
    git pull origin pull/15/head
    ```