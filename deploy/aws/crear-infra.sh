#!/bin/bash
# =====================================================================
#  Crea la infraestructura en AWS (ejecutar en AWS CloudShell, us-east-1)
#    curl -fsSL https://raw.githubusercontent.com/SantiagoJaraHernandez/reservas-canchas/hardening-seguridad/deploy/aws/crear-infra.sh | bash
#  Idempotente: si un recurso ya existe, lo reutiliza.
# =====================================================================
set -euo pipefail
REGION="${AWS_REGION:-us-east-1}"
TYPE="${INSTANCE_TYPE:-t3.small}"
ROLE=reservas-ec2-ssm
SG_NAME=reservas-canchas-web
TAG_KEY=Proyecto; TAG_VAL=reservas-canchas
RAW=https://raw.githubusercontent.com/SantiagoJaraHernandez/reservas-canchas/hardening-seguridad
export AWS_DEFAULT_REGION=$REGION

echo "== 1. Rol IAM de la instancia (solo Session Manager)"
if ! aws iam get-role --role-name $ROLE >/dev/null 2>&1; then
  aws iam create-role --role-name $ROLE --description "EC2 reservas-canchas: solo SSM" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  aws iam attach-role-policy --role-name $ROLE --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
  aws iam create-instance-profile --instance-profile-name $ROLE >/dev/null
  aws iam add-role-to-instance-profile --instance-profile-name $ROLE --role-name $ROLE
  sleep 15
fi

echo "== 2. Security Group (solo 80 y 443; SSH cerrado)"
VPC=$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)
SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=$SG_NAME Name=vpc-id,Values=$VPC --query 'SecurityGroups[0].GroupId' --output text)
if [ "$SG" = "None" ]; then
  SG=$(aws ec2 create-security-group --group-name $SG_NAME --vpc-id $VPC \
       --description "Reservas canchas: solo HTTP/HTTPS" --query GroupId --output text)
  for p in 80 443; do
    aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port $p --cidr 0.0.0.0/0 >/dev/null
  done
  aws ec2 create-tags --resources $SG --tags Key=$TAG_KEY,Value=$TAG_VAL
fi

echo "== 3. Instancia EC2 ($TYPE, Ubuntu 24.04, disco cifrado, IMDSv2)"
EXIST=$(aws ec2 describe-instances --filters Name=tag:$TAG_KEY,Values=$TAG_VAL Name=instance-state-name,Values=pending,running,stopped \
        --query 'Reservations[0].Instances[0].InstanceId' --output text)
if [ "$EXIST" = "None" ]; then
  AMI=$(aws ssm get-parameter --name /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id --query Parameter.Value --output text)
  curl -fsSL "$RAW/deploy/aws/user-data.sh" -o /tmp/user-data.sh
  EXIST=$(aws ec2 run-instances --image-id $AMI --instance-type $TYPE \
    --security-group-ids $SG --iam-instance-profile Name=$ROLE \
    --metadata-options HttpTokens=required,HttpEndpoint=enabled,HttpPutResponseHopLimit=1 \
    --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3,Encrypted=true,DeleteOnTermination=true}' \
    --user-data file:///tmp/user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=reservas-canchas},{Key=$TAG_KEY,Value=$TAG_VAL}]" \
                         "ResourceType=volume,Tags=[{Key=$TAG_KEY,Value=$TAG_VAL}]" \
    --query 'Instances[0].InstanceId' --output text)
fi
aws ec2 wait instance-running --instance-ids $EXIST
IP=$(aws ec2 describe-instances --instance-ids $EXIST --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo
echo "Instancia: $EXIST   IP: $IP"
echo "URL (lista en ~15 min): https://$(echo $IP | tr . -).sslip.io"
