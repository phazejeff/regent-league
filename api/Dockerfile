FROM python:3

RUN pip install uv

WORKDIR /code

COPY __init__.py /code
COPY database.py /code
COPY main.py /code
COPY models.py /code
COPY twitch.py /code
COPY pyproject.toml /code
COPY .python-version /code
COPY uv.lock /code

RUN cd /code && uv sync 

CMD [ "uv", "run", "fastapi", "run", "main.py", "--host", "0.0.0.0" ]
