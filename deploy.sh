#!/bin/bash
# 自动部署脚本 - factoryenergy.site

echo "🚀 开始部署网站..."

cd ~/factoryenergy.site

# 添加所有更改
git add .

# 检查是否有更改
if git diff --staged --quiet; then
    echo "✅ 没有新内容需要部署"
else
    # 输入提交信息
    echo "📝 请输入提交信息（直接回车使用默认）:"
    read -r msg
    if [ -z "$msg" ]; then
        msg="Site updated: $(date '+%Y-%m-%d %H:%M')"
    fi
    
    git commit -m "$msg"
    
    # 推送到 GitHub
    echo "📤 推送到 GitHub..."
    git push origin main
    
    echo "✅ 部署完成！Vercel 将自动重新构建网站"
fi

echo ""
echo "📌 提示: 打开 https://factoryenergy-site.vercel.app 查看网站"
