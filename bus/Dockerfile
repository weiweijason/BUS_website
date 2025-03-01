FROM python:3.12.9

# Install vim
RUN apt-get update && apt-get install -y vim && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /root

# Copy all files from current directory to container's home directory
COPY . /root/

# Install dependencies
# RUN pip install --no-cache-dir -r requirements.txt

CMD ["/bin/bash"]
